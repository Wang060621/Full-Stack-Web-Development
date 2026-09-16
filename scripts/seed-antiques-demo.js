const sqlite3 = require('sqlite3').verbose();

const demoLots = [
    {
        id: 1,
        expectedNames: ['Vintage camera with leather case.', 'Velvet Bloom — After Midnight', 'Miles Davis — Kind of Blue', 'Late-Victorian Silver Pocket Watch'],
        name: 'Late-Victorian Silver Pocket Watch',
        description: 'A silver-cased pocket watch with Roman numeral dial and subsidiary seconds. The case carries honest surface wear from use, while the enamel face and hands remain crisp. Offered with its original chain.',
        categories: ['Timepieces']
    },
    {
        id: 2,
        expectedNames: ['Mechanical keyboard with blue switches.', 'Silver Moon — Still Water', 'Pink Floyd — The Dark Side of the Moon', 'Kodak Jiffy Six-16 Folding Camera'],
        name: 'Kodak Jiffy Six-16 Folding Camera',
        description: 'An American folding camera produced between 1933 and 1937 for 616 roll film. The bellows extend cleanly and the leatherette body shows the gentle edge wear expected of a well-kept travelling camera.',
        categories: ['Photography']
    },
    {
        id: 3,
        expectedNames: ['Mountain bike helmet, size medium.', 'Bauhaus Motion — Forms in Sound', 'Daft Punk — Random Access Memories', 'Mid-Century Manual Typewriter'],
        name: 'Mid-Century Manual Typewriter',
        description: 'A compact mechanical typewriter with round keys, exposed ribbon spools and a clean carriage action. Its black enamel case has developed a soft patina without losing the machine’s strong graphic presence.',
        categories: ['Writing & Print']
    },
    {
        id: 4,
        expectedNames: ['Portable Bluetooth speaker.', 'Northern Range — High Altitude', 'Kendrick Lamar — To Pimp a Butterfly', 'Wooden AM Valve Radio'],
        name: 'Wooden AM Valve Radio',
        description: 'A tabletop AM receiver in a warm wooden cabinet with woven speaker cloth and original tuning controls. The case is structurally sound, with small marks that speak to decades of domestic use.',
        categories: ['Audio & Music']
    },
    {
        id: 5,
        expectedNames: ['Ceramic dinnerware set for four.', 'Quiet Branches — Nocturne', 'Marvin Gaye — What’s Going On', 'French Mother-of-Pearl Opera Glasses'],
        name: 'French Mother-of-Pearl Opera Glasses',
        description: 'French opera glasses dating to around 1910, with iridescent mother-of-pearl veneer, metal frame and optical glass. A graceful theatre accessory with light wear around the focusing wheel.',
        categories: ['Optical']
    },
    {
        id: 6,
        expectedNames: ['Wooden coffee table with storage shelf.', 'Desert Signal — Red Canyon', 'Fleetwood Mac — Rumours', 'Weathered Leather Travel Trunk'],
        name: 'Weathered Leather Travel Trunk',
        description: 'A leather-covered travel trunk with reinforced corners, metal fittings and a richly worn surface. Scuffs and faded labels preserve the character of a piece made for long journeys.',
        categories: ['Travel']
    },
    {
        id: 7,
        expectedNames: ['Smart thermostat, unopened box.', 'Blue Static — Open Circuit', 'Kraftwerk — Trans-Europe Express', 'Japanese Terrestrial Globe, 1695'],
        name: 'Japanese Terrestrial Globe, 1695',
        description: 'A papier-mâché terrestrial globe associated with the work of Japanese scholar Shibukawa Shunkai. Its hand-finished surface and aged stand make it an evocative object of scientific and cartographic history.',
        categories: ['Maps & Globes', 'Scientific Instruments']
    },
    {
        id: 8,
        expectedNames: ['Beginner acoustic guitar bundle.', 'Sunday Strings — Unplugged Sessions', 'Nina Simone — Pastel Blues', 'Swiss Six-Tune Cylinder Music Box'],
        name: 'Swiss Six-Tune Cylinder Music Box',
        description: 'A late nineteenth-century crank-wound music box in an inlaid wooden case. The glass inner lid reveals its pinned brass cylinder, steel comb and compact mechanical movement.',
        categories: ['Mechanical Music', 'Decorative Arts']
    },
    {
        id: 9,
        expectedNames: ['Two-person camping tent.', 'Canvas Nights — Live at the Lantern', 'David Bowie — The Rise and Fall of Ziggy Stardust and the Spiders from Mars', 'American Porcelain Tea Service, c. 1830'],
        name: 'American Porcelain Tea Service, c. 1830',
        description: 'A painted porcelain tea service from Philadelphia, made around 1828–1834. The coordinated teapot, sugar bowl, cups and saucers retain their delicate period decoration.',
        categories: ['Decorative Arts']
    },
    {
        id: 10,
        expectedNames: ['Stainless steel cookware set.', 'Golden Hour — Kitchen Sessions', 'Glenn Gould — Bach: The Goldberg Variations', 'Engraved Brass Qibla Compass'],
        name: 'Engraved Brass Qibla Compass',
        description: 'A nineteenth-century Iranian brass compass densely engraved with a geographical gazetteer for determining the direction of Mecca. A compact scientific instrument with a remarkable worked surface.',
        categories: ['Scientific Instruments']
    },
    {
        id: 11,
        expectedNames: ['Rare crossover pressing', 'Chromatic Passage — Crossover Studies', 'Massive Attack — Blue Lines', 'Early Horn Gramophone'],
        name: 'Early Horn Gramophone',
        description: 'An early mechanical gramophone with a flared metal horn, wooden base and hand-wound turntable mechanism. Its aged finish and visible controls retain the charm of domestic recorded sound.',
        categories: ['Audio & Music', 'Mechanical Music']
    }
];

const legacyCategories = ['Jazz', 'Rock', 'Soul & Funk', 'Electronic', 'Hip-Hop', 'Classical', 'Other'];
const antiqueCategories = [...new Set(demoLots.flatMap((lot) => lot.categories))];
const db = new sqlite3.Database('db.sqlite');

const run = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
        if (error) reject(error);
        else resolve({ changes: this.changes, id: this.lastID });
    });
});

const get = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
        if (error) reject(error);
        else resolve(row);
    });
});

async function seedAntiquesDemo() {
    await run('PRAGMA foreign_keys = ON');
    await run('BEGIN IMMEDIATE TRANSACTION');

    let updated = 0;
    try {
        for (const category of antiqueCategories) {
            await run('INSERT OR IGNORE INTO categories (name) VALUES (?)', [category]);
        }

        for (const lot of demoLots) {
            const current = await get('SELECT name FROM items WHERE item_id = ?', [lot.id]);
            if (!current || !lot.expectedNames.includes(current.name)) {
                console.log(`Skipped lot ${lot.id}: it is not a recognised demo lot.`);
                continue;
            }

            await run(
                'UPDATE items SET name = ?, description = ? WHERE item_id = ?',
                [lot.name, lot.description, lot.id]
            );
            await run('DELETE FROM item_categories WHERE item_id = ?', [lot.id]);

            for (const categoryName of lot.categories) {
                const result = await run(
                    `INSERT INTO item_categories (item_id, category_id)
                     SELECT ?, category_id FROM categories WHERE name = ?`,
                    [lot.id, categoryName]
                );
                if (result.changes !== 1) throw new Error(`Missing category: ${categoryName}`);
            }
            updated += 1;
        }

        for (const category of legacyCategories) {
            await run(
                `DELETE FROM categories
                 WHERE name = ?
                   AND NOT EXISTS (
                       SELECT 1 FROM item_categories
                       WHERE item_categories.category_id = categories.category_id
                   )`,
                [category]
            );
        }

        await run('COMMIT');
        console.log(`Updated ${updated} demo lots as antique collection entries.`);
    } catch (error) {
        await run('ROLLBACK');
        throw error;
    }
}

seedAntiquesDemo()
    .catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
    })
    .finally(() => db.close());
