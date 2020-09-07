import * as yaml from 'js-yaml';
import * as fs from 'fs';
import {Connection} from 'typeorm';

export async function loadFixtures(connection: Connection): Promise<any> {
    let items: any[] = [];

    // CLEAR DATABASE
    const entities = connection.entityMetadatas;

    for (const entity of entities) {
        const repository = await connection.getRepository(entity.name);
        await repository.query(`DELETE FROM ${entity.tableName};`);
    }

    setTimeout(() => {

    }, 5000);

    try {
        const file: any = yaml.safeLoad(fs.readFileSync(`./test/protractor/fixture.yml`, 'utf8'));
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
        console.log(data);
        await connection.createQueryBuilder().insert().into(entityName).values(data).execute();
    });
}
