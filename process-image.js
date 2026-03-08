const Jimp = require('jimp');

async function processImage() {
    const imagePath = 'C:\\Users\\mano_\\.gemini\\antigravity\\brain\\f5d276ba-2aa3-4c95-93fd-200573befd56\\neon_barber_chair_black_1772959028864.png';
    const outPath = 'public\\barber_chair_neon.png';

    const image = await Jimp.read(imagePath);

    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
        const r = this.bitmap.data[idx + 0];
        const g = this.bitmap.data[idx + 1];
        const b = this.bitmap.data[idx + 2];

        const maxColor = Math.max(r, g, b);

        if (maxColor < 5) {
            this.bitmap.data[idx + 3] = 0;
        } else {
            const alpha = maxColor;
            this.bitmap.data[idx + 0] = Math.min(255, Math.floor((r * 255) / alpha));
            this.bitmap.data[idx + 1] = Math.min(255, Math.floor((g * 255) / alpha));
            this.bitmap.data[idx + 2] = Math.min(255, Math.floor((b * 255) / alpha));
            this.bitmap.data[idx + 3] = alpha;
        }
    });

    await image.writeAsync(outPath);
    console.log('Done');
}

processImage().catch(console.error);
