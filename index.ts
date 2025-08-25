import twilio from "twilio";
import { getAllCustomers, getCustomerById, getCustomerByMobile } from "./db";
import express from "express";
import MessagingResponse from "twilio/lib/twiml/MessagingResponse";
import config from "./config";

const twilioClient = twilio(
  config.TWILIO_ACCOUNT_SID!,
  config.TWILIO_AUTH_TOKEN!
);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const PORT = config.PORT || 3000;

app.listen(PORT, async() => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  await listMessages();
});
const arrayOfQuestions = [
  `ACCEPTED. Are you willing to provide a review? Reply 1 for YES, 2 for NO.`,
  `DECLINED. If you change your mind, feel free to reach out. Have a great day!`,
  `ACCEPTED. How was you experience? Reply 1 for GOOD, 2 for AVERAGE, 3 for POOR.`,
  `DECLINED. We're sorry to hear that. Would you like to provide feedback? Reply 1 for YES, 2 for NO.`,
  `GREAT. Thank you for your positive feedback! We appreciate your support.`,
  `THANK YOU for your feedback! We value your input and will strive to improve.`,
  `THANK YOU for your feedback! We value your input and will strive to improve.`,
  `Kindly share your feedback at: https://example.com/feedback. We appreciate your time!`,
  `No worries! `
]
const firstQuestion = "this is a test message from our SMS service. Reply 1 to ACCEPT and 2 to DECLINE`"
export async function sendSMS(customerId: number) {
  const customer = await getCustomerById(customerId);
  const message = `Hello ${customer.name}, ${firstQuestion}`;
  const sms = await twilioClient.messages.create({
    body: message,
    from: config.TWILIO_PHONE_NUMBER,
    to: "+18777804236",
  });

  // const history = await saveHistory(
  //   customer.id,
  //   message,
  // );

  return { customer, sms, history };
}

export async function listMessages(limit?: number) {
  const messages = await twilioClient.messages.list({ limit: limit || 20 });
  
  messages.forEach((m) =>{
    const cleanBody = m.body.includes("-") ? m.body.split("-")[1].trim() : m.body;
    console.log(m.direction=="inbound" ? "Customer: "+m.body : "Admin: "+cleanBody);
  });

}

app.post("/sms", async (req, res) => {
  const { From, To, Body } = req.body;
  console.log(`Incoming SMS from ${From}: ${Body}`);
  try {
    let replyMessage = '' ;
     const msgs = await twilioClient.messages.list({ limit :10 });
    const firstOutbound = msgs.find(m => m.direction !== "inbound");
    if(firstOutbound?.body.includes(firstQuestion))
    {
      replyMessage = Body.trim() === "1" ? arrayOfQuestions[0] : arrayOfQuestions[1];
    }
    else
    {
      
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

