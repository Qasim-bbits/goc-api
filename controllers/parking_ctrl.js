const { Parkings } = require('../models/parking_model');
const stripe = require("stripe")(process.env.SECRET_KEY);

module.exports.buyParking = async function(req,res){
  // if(req.body.token){
  //   console.log(req.body);
  // }
  // return;
    if(req.body.amount == 0){
      console.log(req.body)
      const parkings = new Parkings(req.body);
      parkings.save();
      res.send(parkings);
    }else{
      try {
        const payment = await stripe.paymentIntents.create({
          amount: parseFloat(req.body.amount)*100,
          currency: "CAD",
          description: "Your Company Description",
          payment_method: req.body.paymentMethod.id,
          confirm: true,
        });
        req.body.paymentMethod = payment.payment_method;
        console.log(req.body)
        const parkings = new Parkings(req.body);
        parkings.save();
        res.send(parkings);
      } catch (error) {
        res.json({
          message: error,
          success: false,
        });
      }
    }
}