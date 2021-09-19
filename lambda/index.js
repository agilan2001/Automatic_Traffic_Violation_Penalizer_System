
const nodemailer = require('nodemailer');

var admin = require("firebase-admin");

var serviceAccount = {
    "type": "service_account",
    "project_id": "traffic-penalizer",
    "private_key_id": "8cae305c34884d8f77754dd0af2794f916146b7e",
    "client_email": "firebase-adminsdk-j9sxs@traffic-penalizer.iam.gserviceaccount.com",
    "client_id": "101100714508240143695",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-j9sxs%40traffic-penalizer.iam.gserviceaccount.com"
};

serviceAccount["private_key"] = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://traffic-penalizer-default-rtdb.firebaseio.com"
});

var db = admin.database();

exports.handler = async (event) => {
    var body = JSON.parse(event.body);

    var ret_val = "unknown license";
    var lic_num = body.lic_num;
    var violation_place = body.violation_place;
    var violation_time = body.violation_time;

    db.ref("messages").push(body);
    var snap = await db.ref(`details/${lic_num}/mail`).once("value");
    var mail_id = snap.val();

    if (mail_id) {

        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'trafficpenalizer@gmail.com',
                pass: process.env.GOOGLE_APP_PASS
            }
        });


        var mailOptions = {
            from: 'trafficpenalizer@gmail.com',
            to: mail_id,
            subject: 'Traffic Penalizer Notification',
            html: `<center>
                <div style="font-size:larger; font-weight:bold; text-decoration:underline">Traffic Violation Penalizer Notification</div><br><br>
                <div style="font-size:larger">You are fined for violating the Traffic Signal Rules at ${violation_place} on ${violation_time}  </div><br><br>
                <img src = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSHZ877hf4NZ2uNAGZqSFt2ENxwq9ZLzRmJjQ&usqp=CAU">
            </center>`
        };
        await transporter.sendMail(mailOptions);
        ret_val = "Mail Notif Sent";

    }

    return ({
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST"
        },
        body: JSON.stringify(ret_val),
    })

};
