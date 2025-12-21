const { generatePersonalizedProduct } = require('./utils/aiService');
const dummyDesign = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==";

async function test() {
    console.log("Testing generatePersonalizedProduct with Sharp...");
    try {
        const result = await generatePersonalizedProduct('Coffee Mug', dummyDesign);
        console.log("Success! Result length:", result.length);
    } catch (error) {
        console.error("Test Failed:", error);
    }
}

test();
