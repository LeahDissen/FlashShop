const { CatalogModel } = require('../models/catalogModel');

const fixFilenameEncoding = (name) => {
    if (!name) return 'catalog.pdf';
    try {
        return Buffer.from(name, 'latin1').toString('utf8');
    } catch {
        return name;
    }
};

const buildContentDisposition = (filename) => {
    const safeName = fixFilenameEncoding(filename);
    const asciiFallback = safeName.replace(/["\r\n]/g, '').replace(/[^\x20-\x7E]/g, '_') || 'catalog.pdf';
    const encoded = encodeURIComponent(safeName);
    return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
};

exports.uploadCatalog = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded' });
        }

        await CatalogModel.deleteMany({});

        const newCatalog = new CatalogModel({
            filename: fixFilenameEncoding(req.file.originalname),
            contentType: req.file.mimetype,
            data: req.file.buffer
        });

        await newCatalog.save();

        res.json({ msg: 'Catalog uploaded successfully to MongoDB' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error during upload' });
    }
};

exports.downloadCatalog = async (req, res) => {
    try {
        const catalog = await CatalogModel.findOne().sort({ updatedAt: -1 });

        if (!catalog) {
            return res.status(404).send('Catalog not found');
        }

        res.set('Content-Type', catalog.contentType);
        res.set('Content-Disposition', buildContentDisposition(catalog.filename));
        res.send(catalog.data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error downloading catalog');
    }
};