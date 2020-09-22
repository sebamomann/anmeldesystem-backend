import * as fs from 'fs';
import {Connection} from 'typeorm';
import * as yaml from 'js-yaml';

export async function loadFixtures(connection: Connection): Promise<any> {
    let items: any[] = [];

    // CLEAR DATABASE
    const entities = connection.entityMetadatas;
    await connection.query('SET FOREIGN_KEY_CHECKS=0;');
    for (const entity of entities) {
        const repository = await connection.getRepository(entity.name);
        await repository.query(`DELETE FROM ${entity.tableName};`);
    }
    await connection.query('SET FOREIGN_KEY_CHECKS=1;');

    setTimeout(() => {

    }, 5000);

    fs.readdirSync('test/protractor/fixtures').forEach(fileName => {
        const file: any = yaml.safeLoad(fs.readFileSync(`test/protractor/fixtures/${fileName}`, 'utf8'));
        try {
            items = file['fixtures'];
        } catch (e) {
            console.log('fixtures error', e);
        }

        if (!items) {
            return;
        }

        items.forEach(async (item: any) => {
            const entityName = Object.keys(item)[0];
            const data = item[entityName];
            await connection.createQueryBuilder().insert().into(entityName).values(data).execute();
        });
    });
}
