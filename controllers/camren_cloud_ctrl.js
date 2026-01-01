const { carmenAPIKey } = require('../lib/constant');
const { VehicleAPIClient, Locations } = require("@adaptive-recognition/carmen-cloud-client");
const client = new VehicleAPIClient({
    apiKey: carmenAPIKey,
    services: { anpr: true },
    inputImageLocation: Locations.NorthAmerica.CanadaOntario,
    cloudServiceRegion: "US"
});


module.exports.scanImage = async function(req,res){
    try {
        const uploadedFile = req.file;
        console.log(client)

        // Ensure a file was uploaded
        if (!uploadedFile) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const imageBuffer = uploadedFile.buffer;

        // Assuming you have a client with a send method
        // Replace 'client' with your actual client implementation
        const response = await client.send(imageBuffer);
        // Send the recognition response in the API call response
        res.json({ message: 'Recognition successful', recognitionResponse: response });
    } catch (error) {
        console.error('Error processing recognition:', error);

        // Send a more descriptive error message in the response
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
}