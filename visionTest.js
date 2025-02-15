import { ImageAnnotatorClient } from '@google-cloud/vision';

// Creates a client
const client = new ImageAnnotatorClient();

async function detectText() {
    const [result] = await client.textDetection('handwriting_sample.jpg'); // Replace with your image file
    const detections = result.textAnnotations;
    console.log('Text:', detections[0] ? detections[0].description : 'No text found');
}

detectText().catch(console.error);
