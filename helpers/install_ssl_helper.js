const fs = require('fs');
const { exec } = require('child_process');
const nodemailer = require("nodemailer");
const { Organizations } = require('../models/organizations_model');

module.exports.installSSL = async(domain) => {
    try {
        const organizations = await Organizations.find({ssl_installed: { $ne: true }}).select('-__v');
        const domainsString = organizations.map(row => row.sub_domain).join('\n');
        console.log(domainsString)
        await fs.promises.writeFile('subdomains.txt', domainsString);
        console.log('Domains have been successfully written to subdomains.txt');

        exec('sudo /var/www/html/park45-api/install_ssl_subdomains.sh', (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return 'Internal Server Error';
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
            // Update ssl_installed column in the database
            Organizations.updateMany({ssl_installed: false}, {"$set":{ssl_installed: true}})
            .then(() =>{
                return 'Script executed successfully and database updated'
            })
        });
    } catch (error) {
        console.error('Error:', error);
        return 'Internal Server Error';
    }
}

exports.testEmail = async(req, res) => {
    try {
        const transporter = nodemailer.createTransport({
            host: "smtp.ionos.com",
            port: 587,
            tls: true,
            auth: {
                user: "support@condoparking45.org",
                pass: "Kuvu5596!",
            },
        });

        const mailOptions = {
            from: "support@condoparking45.org",
            to: 'ahsanayoub2017@gmail.com',
            subject: "Ventra Support",
            text: `Hello Ahsan Ayoub`,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent: " + info.response);
    } catch (err) {
        console.log('Email is not valid:', err);
    }
}

// exports.installSSL = async (req, res) => {
//     const sql_query = `
//         SELECT * FROM organizations WHERE ssl_installed = 0;`;
//     const result = await new Promise((resolve, reject) => {
//         db.query(sql_query, (err, result, fields) => {
//             if (err) reject(err);
//             else resolve(result.map(row => ({ domain: row.domain.replace('.ventrafleet.com', '') })));
//         });
//     });
//     const domainsString = result.map(row => row.domain).join('\n');

//     // Write the formatted domains to the text file
//     fs.writeFile('subdomains.txt', domainsString, (err) => {
//         if (err) {
//             console.error('Error writing to file:', err);
//         } else {
//             console.log('Domains have been successfully written to subdomains.txt');
//         }
//     });

//     exec('sudo /var/www/html/ventra/install_ssl_subdomains.sh', (error, stdout, stderr) => {
//         if (error) {
//             console.error(`exec error: ${error}`);
//             return res.status(500).send('Internal Server Error');
//         }
//         console.log(`stdout: ${stdout}`);
//         console.error(`stderr: ${stderr}`);
//         // Update ssl_installed column in the database
//         const update_query = `UPDATE organizations SET ssl_installed = 1 WHERE ssl_installed = 0`;
//         db.query(update_query, (err, result) => {
//             if (err) {
//                 console.error('Error updating database:', err);
//                 return res.status(500).send('Error updating database');
//             }

//             console.log('ssl_installed column updated successfully');
//             res.send('Script executed successfully and database updated');
//         });
//     });
// }