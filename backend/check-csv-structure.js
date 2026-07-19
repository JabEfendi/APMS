
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const dataDir = path.join(__dirname, 'data');

fs.readdir(dataDir, (err, files) => {
    if (err) {
        console.error('Error reading data directory:', err);
        process.exit(1);
    }

    const csvFiles = files.filter(file => file.endsWith('.csv'));
    let completed = 0;

    csvFiles.forEach(file => {
        const filePath = path.join(dataDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');

        Papa.parse(fileContent, {
            header: true,
            complete: (results) => {
                console.log(`\n=== ${file} ===`);
                console.log('Columns:', results.meta.fields);
                if (results.data.length > 0) {
                    console.log('Sample row:', results.data[0]);
                }
                console.log('Total rows:', results.data.length);
                completed++;

                if (completed === csvFiles.length) {
                    console.log('\nAll files processed!');
                }
            }
        });
    });
});
