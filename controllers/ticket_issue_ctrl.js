const { Ticket_Issued } = require('../models/ticket_issued_model');
const { Tickets } = require('../models/tickets_model');
const { Users } = require('../models/users_model');
const { Ticket_Aging } = require('../models/tickets_aging_model');
const { Organizations } = require('../models/organizations_model');
const { crypto_decrypt } = require('../helpers/encrypt_helper');
const moment = require('moment-timezone');
moment.tz.setDefault("America/New_York");
var mongoose = require('mongoose');
const { Cities } = require('../models/city_model');
const { Printed_Tickets } = require('../models/printed_tickets_model');

module.exports.getTicketsIssued = async function (req, res) {
  let body = {}
  let user = await Users.find({ org: req.body.org_id }).select('-__v');
  if (user.length > 0 && user[0].role !== 'root') {
    body['org'] = mongoose.Types.ObjectId(req.body.org_id);
  }
  const TicketIssued = await Ticket_Issued.find(body, { images: 0 }).
    populate('org').
    populate('city').
    populate('zone').
    populate('parking').
    populate('ticket').
    sort({ _id: -1 }).select('-__v');
  res.send(TicketIssued);
}
module.exports.IssueTicket = async function (req, res) {
  const city = await Cities.findOne({ _id: req.body.city }).select('-__v');
  if (city.time_zone) {
    moment.tz.setDefault(city.time_zone);
  } else {
    moment.tz.setDefault("America/New_York");
  }
  req.body.ticket_status = 'unpaid';
  req.body.issued_at = moment().format();
  const ticket = await Tickets.findOne({ _id: req.body.ticket }).select('-__v');
  if (ticket !== null) {
    req.body.ticket_num = ticket.ticket_num_next;
    let ticketIssued = new Ticket_Issued(req.body);
    ticketIssued.save(async (err, data) => {
      if (err) {
        res.send({
          status: 'error',
          msg: 'Something went wrong, Please try again'
        });
      } else {
        let recentTicketIssued = await Ticket_Issued.findOne({ _id: data._id }).select('-__v');
        if (recentTicketIssued) {
          Tickets.updateMany({ org: req.body.org }, { "$set": { ticket_num_next: ticket.ticket_num_next + 1 } })
            .then(response => {
              let result = ticketIssued.toObject();
              result.ticket_num_next = ticket.ticket_num_next + 1;
              // let logs_body = {
              //   api: 'issueTicket',
              //   request: JSON.stringify(req.body),
              //   response: JSON.stringify(result),
              // }
              // const logs = new Logs(logs_body);
              // logs.save();      
              res.send(result);
            })
        } else {
          res.send({
            status: 'error',
            msg: 'Something went wrong, Please try again'
          });
        }
      }
    });
  } else {
    res.send({
      status: 'error',
      msg: 'invalid_ticket'
    });
  }
}

module.exports.editIssueTicket = async function (req, res) {
  Ticket_Issued.findByIdAndUpdate(req.body.id, req.body, { new: true })
    .then(response => {
      res.send(response);
    })
}

module.exports.searchTicket = async function (req, res) {
  let ticketIssued = await Ticket_Issued.findOne({
    plate: req.body.plate,
    ticket_status: 'unpaid'
  }).
    populate('org').
    populate('city').
    populate('zone').
    populate('parking').
    populate('ticket').
    select('-__v');
  if (ticketIssued == null) {
    res.send({
      status: 'error',
      msg: 'ticket_not_found'
    })
  } else if (ticketIssued.ticket_status == 'paid') {
    res.send({
      status: 'info',
      msg: 'already_paid'
    })
  } else {
    let ticketsIssued = await Ticket_Issued.find({ plate: req.body.plate, ticket_status: 'unpaid' }).
      populate('org').
      populate('city').
      populate('zone').
      populate('parking').
      populate('ticket').
      select('-__v');
    let allTickets = [];
    await Promise.all(ticketsIssued.map((async x => {
      var date_now = moment();
      var issued_at = moment(x.issued_at);
      var min_difference = date_now.diff(issued_at, 'days') * 60 * 24;
      let ticketAging = await Ticket_Aging.find({ ticket: x.ticket._id }).select('-__v');
      let ticketAmount = {};
      ticketAging.map(x => {
        if (x.applied_to !== null) {
          if (min_difference >= x.applied_from && min_difference <= x.applied_to && Object.keys(ticketAmount).length == 0) {
            ticketAmount = x;
          }
        } else {
          if (x.applied_from <= min_difference && x.applied_to == null && Object.keys(ticketAmount).length == 0) {
            ticketAmount = x;
          }
        }
      })
      let selectedTicket = ticketAmount.toObject();
      selectedTicket.day_passed = parseInt(min_difference / 60 / 24);
      let obj = {
        ticketIssued: x,
        ticketAging: ticketAging,
        ticketAmount: selectedTicket
      }
      allTickets.push(obj);
    })))
    res.send(allTickets)
  }
}

module.exports.payTicket = async function (req, res) {
  const bulkOps = req.body.ticketIds.map(obj => {
    return {
      updateOne: {
        filter: { _id: obj.id },
        update: { amount: obj.amount, ticket_status: 'paid' }
      }
    }
  });
  if (req.body.payment_gateway == 'moneris') {
    Ticket_Issued.bulkWrite(bulkOps).then((response) => {
      res.send(response);
    })
  } else {
    const org = await Organizations.findOne({ _id: req.body.org }).select('-__v');
    let secret_key = crypto_decrypt(org.stripe_secret_key);
    const stripe = require("stripe")(secret_key);
    try {
      const payment = await stripe.paymentIntents.create({
        amount: parseFloat(req.body.amount),
        currency: "usd",
        description: "Ticket paid for " + req.body.plate + " in " + req.body.zone_name + ", issued at " + moment(req.body.issued_at).format('MMM Do YY, hh:mm a'),
        automatic_payment_methods: {
          enabled: true,
        }
      });
      await stripe.paymentIntents.confirm(
        payment.id,
        {
          payment_method: req.body.paymentMethod.id,
          return_url: 'https://park45.ca/zone'
        }
      );
      req.body.paymentMethod = payment.payment_method;
      req.body.ticket_status = 'paid';
      req.body.paid_at = moment().format();
      Ticket_Issued.bulkWrite(bulkOps).then((response) => {
        res.send(response);
      })
    } catch (e) {
      switch (e.type) {
        case 'StripeCardError':
          res.json({
            message: e.message,
            status: 'error',
          });
          break;
        case 'StripeInvalidRequestError':
          res.json({
            message: 'An invalid request occurred.',
            status: 'error',
          });
          break;
        default:
          res.json({
            message: 'Another problem occurred, maybe unrelated to Stripe.',
            status: 'error',
          });
          break;
      }
    }
  }
}

module.exports.getTicketsIssuedByAgent = async function (req, res) {
  let query = { issued_by: req.body.agent };
  if (req.body.start_date && req.body.end_date) {
    const end_date = req.body.end_date + 'T23:59:59.000Z';
    const start_date = req.body.start_date + 'T00:00:00.000Z';
    query = { ...query, issued_at: { $gte: start_date, $lte: end_date } }
  }
  const TicketIssued = await Ticket_Issued.find(query).
    populate('city').
    populate('zone').
    populate('parking').
    populate('ticket').
    sort({ _id: -1 }).
    select('-images').
    limit(50);
  res.send(TicketIssued);
}

module.exports.getTicketIssuedDetail = async function (req, res) {
  const TicketIssued = await Ticket_Issued.findById(req.params.id).
    populate('city').
    populate('zone').
    populate('parking').
    populate('ticket').
    select('-__v');
  res.send(TicketIssued);
}

module.exports.delTicketIssued = async function (req, res) {
  const ticket = await Ticket_Issued.deleteOne({ _id: req.params.id }).select('-__v');
  res.send(ticket);
}

module.exports.addPrintedTicket = async function (req, res) {
  let printedTicket = new Printed_Tickets(req.body);
  printedTicket.save(async (err, data) => {
      if (err) {
        res.send({
          status: 'error',
          msg: 'Something went wrong, Please try again'
        });
      } else {
        Ticket_Issued.findByIdAndUpdate(req.body.ticketIssued, {ticket_printed: data._id, is_ticket_printed: true}, { new: true })
        .then(response => {
          res.send(response);
        })
      }
    })
}