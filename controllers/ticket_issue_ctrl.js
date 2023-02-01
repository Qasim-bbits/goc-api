const { Ticket_Issued } = require('../models/ticket_issued_model');
const { Tickets } = require('../models/tickets_model');
const { Users } = require('../models/users_model');
const { Ticket_Aging } = require('../models/tickets_aging_model');
const { Organizations } = require('../models/organizations_model');
const { crypto_decrypt } = require('../helpers/encrypt_helper');
const moment = require('moment-timezone');
moment.tz.setDefault("America/New_York");
var mongoose = require('mongoose');

module.exports.getTicketsIssued = async function (req, res){
  let body = {}
  let user = await Users.find({org: req.body.org_id}).select('-__v');
  if(user.length > 0 && user[0].role !== 'root'){
      body['org'] = mongoose.Types.ObjectId(req.body.org_id);
  }
  const TicketIssued = await Ticket_Issued.find(body).
  populate('org').
  populate('city').
  populate('zone').
  populate('parking').
  populate('ticket').
  sort({_id: -1}).select('-__v');
  res.send(TicketIssued);
}

module.exports.IssueTicket = async function(req,res){
  req.body.ticket_status = 'unpaid';
  req.body.issued_at = moment().format();
  const ticket = await Tickets.findOne({_id: req.body.ticket}).select('-__v');
  if(ticket !==  null){
    req.body.ticket_num = ticket.ticket_num_next;
    const ticketIssued = new Ticket_Issued(req.body);
    Tickets.findByIdAndUpdate(req.body.ticket, {ticket_num_next: ticket.ticket_num_next+1}, {new: true})
    .then(response =>{
      ticketIssued.save();
      let result = ticketIssued.toObject();
      result.ticket_num_next = response.ticket_num_next;
      res.send(result);
    })
  }else{
    res.send({
      status: 'error',
      msg: 'invalid_ticket'
    });
  }
}

module.exports.editIssueTicket = async function(req,res){
  Ticket_Issued.findByIdAndUpdate(req.body.id, req.body, {new: true})
  .then(response =>{
      res.send(response);
  })
}

module.exports.searchTicket = async function(req,res){
  let ticketIssued = await Ticket_Issued.findOne({
    city: req.body.city,
    org: req.body.org,
    plate : req.body.plate,
    ticket_num : req.body.ticket_num
  }).
  populate('org').
  populate('city').
  populate('zone').
  populate('parking').
  populate('ticket').
  select('-__v');
  if(ticketIssued == null){
    res.send({
      status: 'error',
      msg: 'ticket_not_found'
    })
  }else if(ticketIssued.ticket_status == 'paid'){
    res.send({
      status: 'info',
      msg: 'already_paid'
    })
  }else{
    var date_now = moment();
    var issued_at = moment(ticketIssued.issued_at);
    var min_difference = date_now.diff(issued_at, 'days')*60*24;
    let ticketAging = await Ticket_Aging.find({ticket : ticketIssued.ticket._id}).select('-__v');
    let ticketAmount = {};
    ticketAging.map(x=>{
      if(x.applied_to !== null){
        if(min_difference >= x.applied_from && min_difference <= x.applied_to && Object.keys(ticketAmount).length == 0){
          ticketAmount = x;
        }
      }else{
        if(x.applied_from <= min_difference && x.applied_to == null && Object.keys(ticketAmount).length == 0){
          ticketAmount = x;
        }
      }
    })
    let selectedTicket = ticketAmount.toObject();
    selectedTicket.day_passed = parseInt(min_difference/60/24);
    let obj = {
      ticketIssued: ticketIssued,
      ticketAging: ticketAging,
      ticketAmount: selectedTicket
    }
    res.send(obj)
  }
}

module.exports.payTicket = async function(req,res){
  const ticket_issued = await Ticket_Issued.findOne({_id: req.body.id, ticket_status: 'paid'}).select('-__v');
  if(ticket_issued == null){
    if(req.body.payment_gateway == 'moneris'){
      console.log(req.body)
      req.body.ticket_status = 'paid';
      Ticket_Issued.findByIdAndUpdate(req.body.id, req.body, {new: true})
      .then(response =>{
          res.send(response);
      })
    }else{
      const org = await Organizations.findOne({_id: req.body.org}).select('-__v');
      let secret_key = crypto_decrypt(org.stripe_secret_key);
      const stripe = require("stripe")(secret_key);
      try {
        const payment = await stripe.paymentIntents.create({
          amount: parseFloat(req.body.amount),
          currency: "CAD",
          description: "Ticket paid for " +req.body.plate + " in "+req.body.zone_name+", issued at " + moment(req.body.issued_at).format('MMM Do YY, hh:mm a'),
          payment_method: req.body.paymentMethod.id,
          confirm: true,
        });
        req.body.paymentMethod = payment.payment_method;
        req.body.ticket_status = 'paid';
        Ticket_Issued.findByIdAndUpdate(req.body.id, req.body, {new: true})
        .then(response =>{
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
  }else{
    res.json({
      message: 'Already Paid',
      status: 'info',
    });
  }
}

module.exports.getTicketsIssuedByAgent = async function (req, res){
  const TicketIssued = await Ticket_Issued.find({agent: req.body.issued_by}).
  populate('city').
  populate('zone').
  populate('parking').
  populate('ticket').
  sort({_id: -1}).select('-__v');
  res.send(TicketIssued);
}