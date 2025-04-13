import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

export const getPrices = () => {
  try {
    return {
      price_per_day: parseFloat(process.env.PRICE_PER_DAY) || 0,
      gala_dinner_cost: parseFloat(process.env.GALA_DINNER_COST) || 0
    };
  } catch (error) {
    console.error('Error getting prices:', error);
    throw error;
  }
};

export const setPrices = (prices) => {
  try {
    // Read the current .env file
    const envPath = path.resolve(process.cwd(), '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Update the values in the .env content
    if (prices.price_per_day !== undefined) {
      envContent = envContent.replace(
        /PRICE_PER_DAY=.*/,
        `PRICE_PER_DAY=${prices.price_per_day}`
      );
    }
    if (prices.gala_dinner_cost !== undefined) {
      envContent = envContent.replace(
        /GALA_DINNER_COST=.*/,
        `GALA_DINNER_COST=${prices.gala_dinner_cost}`
      );
    }

    // Write the updated content back to the .env file
    fs.writeFileSync(envPath, envContent);

    // Update process.env
    if (prices.price_per_day !== undefined) {
      process.env.PRICE_PER_DAY = prices.price_per_day.toString();
    }
    if (prices.gala_dinner_cost !== undefined) {
      process.env.GALA_DINNER_COST = prices.gala_dinner_cost.toString();
    }

    return getPrices();
  } catch (error) {
    console.error('Error setting prices:', error);
    throw error;
  }
}; 