import twilio from "twilio";
import { getAllCustomers, getCustomerById, getCustomerByMobile, statuses, updateCustomerStatus } from "./db";
import express from "express";
import MessagingResponse from "twilio/lib/twiml/MessagingResponse";
import config from "./config";
import cors from "cors";

const twilioClient = twilio(
  config.TWILIO_ACCOUNT_SID!,
  config.TWILIO_AUTH_TOKEN!
);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const PORT = config.PORT || 3000;

app.listen(PORT, async() => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
const readyQuestions = [
  `Great. When do you want the product to be delivered? Reply 1 for TODAY, 2 for SOME OTHER TIME.`,
  `Okay. You product won't be scheduled for delivery today. We'll notify you when it's ready for pickup.`,
  `Sorry to hear that. Your order has been cancelled. We'll notify you when it's ready for pickup.`,
  `Delivering Today. Please provide a time slot. Reply 1 for MORNING (8 AM - 12 PM), 2 for AFTERNOON (12 PM - 4 PM), 3 for EVENING (4 PM - 8 PM).`,
  `Okay. We will schedule your delivery for some other time. We'll notify you when it's ready for pickup.`,
  `GREAT. Thank you for choosing a time slot. Your product will be delivered today between 8 AM and 12 PM.`,
  `GREAT. Thank you for choosing a time slot. Your product will be delivered today between 12 PM and 4 PM.`,
  `GREAT. Thank you for choosing a time slot. Your product will be delivered today between 4 PM and 8 PM..`,
]
const scheduledQuestions = [
  `Thank you for confirming. Your product will be delivered as per the scheduled time.`,
  `Okay. We will notify you when it's again scheduled for delivery.`,
]
const DeliveredQuestions = [
  `Thank you for confirming. Would you like to provide feedback on our service? Reply 1 for YES and 2 for NO`,
  `Kindly enter the issue faced while delivery. 1 - Damaged Product, 2 - Wrong Product, 3 - Missing Items, 4 - Other Issues`,
  `How was you experience with us? Reply 1 for EXCELLENT, 2 for GOOD, 3 for AVERAGE, 4 for POOR`,
  `No worries. Thank you for your time.`,

  `Thank you for your amazing feedback! We appreciate you taking the time to help us improve our service.`,
  `Thank you for your feedback! We appreciate you taking the time to help us improve our service.`,
  `Thank you for your feedback! We will look into improving out services.`,
  `Sorry for you inconvenience. We will strive to improve our services.`,
  `We're sorry to hear that you faced issues with your delivery. Our support team will reach out to you shortly to resolve the issue.`,
]
const firstQuestion = "You order has been placed. Would you like to schedule the delivery? Reply 1 for YES and 2 for NO OR 3 for CANCEL";
const secondQuestion = "Your delivery is scheduled for today and will be delivered in you selected slot time? If yes, reply 1 else 2";
const thirdQuestion = "Your product has been delivered. Reply 1 to CONFIRM and 2 to REPORT ISSUE";
export async function sendSMS(customerId: number, questionNumber?: number, msg?: string) {
  const customer = await getCustomerById(customerId);
  const question = questionNumber === 1 ? firstQuestion : questionNumber === 2 ? secondQuestion : questionNumber === 3 ? thirdQuestion : firstQuestion;
  const message = msg ? msg : `Hello ${customer.name}, ${question}`;
  const sms = await twilioClient.messages.create({
    body: message,
    from: config.TWILIO_PHONE_NUMBER,
    to: customer.mobile_number,
  });

  // const history = await saveHistory(
  //   customer.id,
  //   message,
  // );

  return { customer, sms };
}

export async function listMessages(customerId: number) {
  const customer = await getCustomerById(customerId);
  const [sent, received] = await Promise.all([
  twilioClient.messages.list({ to: customer.mobile_number, limit: 50 }),
  twilioClient.messages.list({ from: customer.mobile_number, limit: 50 }),
]);

const conversation = [...sent, ...received].sort(
  (a, b) => new Date(a.dateCreated).getTime() - new Date(b.dateCreated).getTime()
);

  const response = conversation.map((m) =>{
    const cleanBody = m.body.includes("-") ? m.body.split("-")[1].trim() : m.body;
   return({Customer : m.direction=="inbound" ? m.body : "",
    Admin: m.direction!=="inbound" ? cleanBody : "",
    Date: m.dateCreated
   });
  });
  return response;
}

app.post("/send-sms", async (req, res) => {
  try {
    const {id: customerId, msg} = req.body;
    await sendSMS(customerId, msg);
    res.status(200).send({status:'Successfully Sent message to customer'})
  } catch (error: any) {
    res.status(500).send({'Error while sending message':error?.message});
  }
});
app.post("/customers", async (req, res) => {
  try {
   const data = await getAllCustomers();
    res.json(data);
  } catch (error: any) {
    res.status(500).send({'Error while sending message':error?.message});
  }
});
app.post("/history", async (req, res) => {
  try {
     const {id: customerId} = req.body;
   const data = await listMessages(customerId);
    res.json(data);
  } catch (error: any) {
    res.status(500).send({'Error while sending message':error?.message});
  }
});
app.get("/statuses", async (req, res) => {
  try {
    res.json(statuses);
  } catch (error: any) {
    res.status(500).send({'Error while sending message':error?.message});
  }
});
app.put("/statuses", async (req, res) => {
  try {
     const {id: customerId, status: statusId} = req.body;
    await updateCustomerStatus(customerId, statusId);
    await sendSMS(customerId,statusId)
     res.status(200).send({status:'Successfully Updated Status'})
  } catch (error: any) {
    res.status(500).send({'Error while sending message':error?.message});
  }
});

app.post("/sms", async (req, res) => {
  const { From, To, Body } = req.body;
  console.log(`Incoming SMS from ${From}: ${Body}`);
  try {
    let replyMessage = '' ;
   
    const defaultMessage = "Sorry, I didn't understand that. Please reply with the correct option.";
     if(!(Number(Body.trim())))
        replyMessage = defaultMessage;
     const msgs = await twilioClient.messages.list({ limit :20 });
    const firstOutbound = msgs.find(m => m.direction !== "inbound");
     const secondOutbound = msgs.find(m => {  return m.direction !== "inbound" && m !== firstOutbound;
     });
    if(firstOutbound?.body.includes(firstQuestion))
    {
      replyMessage = Body.trim() === "1" ? readyQuestions[0] : Body.trim() === "2" ? readyQuestions[1] : Body.trim() === "3" ? readyQuestions[2] : defaultMessage;
      if(Body.trim() === "3")
        updateCustomerStatus((await getCustomerByMobile(From)).id, 4);
    }
    else if(firstOutbound?.body.includes(secondQuestion))
    {
      replyMessage = Body.trim() === "1" ? scheduledQuestions[0] : Body.trim() === "2" ? scheduledQuestions[1] : defaultMessage;
    }
    else if(firstOutbound?.body.includes(thirdQuestion))
    {
      replyMessage = Body.trim() === "1" ? DeliveredQuestions[0] :Body.trim() === "2" ? DeliveredQuestions[1] : defaultMessage;
    }
    else if(readyQuestions.some(q => firstOutbound?.body.includes(q)))
    {
      console.log("First Outbound: ", firstOutbound?.body);
      const index = readyQuestions.findIndex(q => firstOutbound.body.includes(q));
      const numbers = firstOutbound?.body.match(/\d+/g)
      const numbersQues = secondOutbound?.body.match(/\d+/g)
      console.log(numbersQues)
      console.log(secondOutbound)
      if(index != -1)
        replyMessage = "Error Occured";
      if(!numbers?.includes(Body))
        replyMessage = "Invalid Response. Please reply with the correct option.";
      else
        replyMessage = readyQuestions[index + parseInt(Body) + (numbersQues ? numbersQues.length : 1) -1]; 
    }
    else if(DeliveredQuestions.some(q => firstOutbound?.body.includes(q))){
       console.log("First Outbound: ", firstOutbound?.body);
      const index = DeliveredQuestions.findIndex(q => firstOutbound.body.includes(q));
      
      const numbers = firstOutbound?.body.match(/\d+/g)
      const numbersQues = secondOutbound?.body.match(/\d+/g)
      console.log(numbersQues)
      console.log(secondOutbound)
      if(index != -1)
        replyMessage = "Error Occured";
      if(!numbers?.includes(Body))
        replyMessage = "Invalid Response. Please reply with the correct option.";
      else
        replyMessage = DeliveredQuestions[index + parseInt(Body) + (numbersQues ? numbersQues.length : 1) -1]; 
    }
    await twilioClient.messages.create({
      body: replyMessage,
      from: To, 
      to: From, 
    });

    res.send("<Response></Response>");
  } catch (err) {
    console.error(" Inbound handling failed:", err);
    res.status(500).send("Inbound handling failed");
  }
})

