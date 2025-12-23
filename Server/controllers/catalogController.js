const { CatalogModel } = require('../models/catalogModel');

exports.uploadCatalog = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded' });
        }

        await CatalogModel.deleteMany({});

        const newCatalog = new CatalogModel({
            filename: req.file.originalname,
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
        res.set('Content-Disposition', `attachment; filename="${catalog.filename}"`);
        res.send(catalog.data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error downloading catalog');
    }
};