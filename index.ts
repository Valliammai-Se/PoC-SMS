import twilio from "twilio";
import { getCustomerById, getCustomerByMobile, saveHistory } from "./db";
import express from "express";
import MessagingResponse from "twilio/lib/twiml/MessagingResponse";

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
export async function sendSMS(customerId: number, message: string) {
  // const customer = await getCustomerById(customerId);

  const sms = await twilioClient.messages.create({
    body: "Hello Testing From BE",
    from: process.env.TWILIO_PHONE_NUMBER,
    to: "+18777804236",
    statusCallback: process.env.TWILIO_STATUS_CALLBACK,
  });

  // const history = await saveHistory(
  //   customer.id,
  //   message,
  // );

  // return { customer, sms, history };
}
app.post("/sms", async (req, res) => {
  console.log("Received inbound SMS:", req.body);
  const twiml = new MessagingResponse();
  res.send("response hii")
  const { From, To, Body } = req.body;
  console.log(`Incoming SMS from ${From}: ${Body}`);
  const customer = await getCustomerByMobile(From);
  await saveHistory(customer.id,Body );
  try {
    let replyMessage = "We received your reply, thank you!";

    if (Body.trim().toUpperCase() === "YES") {
      replyMessage = "Thanks for confirming!";
    } else if (Body.trim().toUpperCase() === "NO") {
      replyMessage = "Sorry to hear that. We’ll follow up shortly.";
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

