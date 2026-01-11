import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';

dotenv.config();

const { NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD } = process.env;

const driver = neo4j.driver(
    NEO4J_URI,
    neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
);

export const getSession = () => driver.session();

export const closeDriver = async () => {
    await driver.close();
};

export default driver;
