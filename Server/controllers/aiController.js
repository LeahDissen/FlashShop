// Server/controllers/aiController.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { config } = require("../config/secret");

const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);

exports.generateProductPreview = async (req, res) => {
    try {
        const { productType, imageBase64 } = req.body;

        if (!productType || !imageBase64) {
            return res.status(400).json({ msg: "Missing productType or imageBase64" });
        }

        // Clean the base64 string (remove the data:image/png;base64, prefix if present)
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Create a high-quality, realistic product mockup. 
        Product: ${productType}. 
        Apply the provided design onto the product naturally, respecting lighting, shadows, and texture. 
        Return ONLY the image of the finished product on a neutral background.`;

        const imageParts = [
            {
                inlineData: {
                    data: base64Data,
                    mimeType: "image/png",
                },
            },
        ];

        const result = await model.generateContent([prompt, ...imageParts]);
        const response = await result.response;
        
        // Note: Gemini 1.5 Flash primarily returns text descriptions unless configured for image output 
        // or if you are using it to analyze the image. 
        // IF you are using a model that generates images (like Imagen via Vertex AI), the code differs.
        // Assuming you want text analysis or if using a multimodal capability to describe/process:
        const text = response.text();
        
        // Since Gemini 1.5 Flash via standard API doesn't typically return a generated *image* buffer directly 
        // (it describes images or processes text), if you strictly need Image-to-Image generation (Mockup),
        // you might need to check the specific model capabilities available to your key or return the text/analysis.
        // However, for this example, we will send back the result as text or if you have a base64 image response logic:
        
        res.json({ result: text }); 

    } catch (err) {
        console.error("AI Generation Error:", err);
        res.status(500).json({ msg: "Failed to generate preview", error: err.message });
    }
};