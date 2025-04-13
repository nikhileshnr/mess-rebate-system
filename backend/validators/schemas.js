/**
 * Rebate validation schemas
 */
const rebateSchemas = {
  create: {
    roll_no: {
      required: true,
      type: 'string',
      minLength: 1,
      maxLength: 20
    },
    start_date: {
      required: true,
      type: 'string',
      isDate: true
    },
    end_date: {
      required: true,
      type: 'string',
      isDate: true,
      custom: (value, data) => {
        if (new Date(value) <= new Date(data.start_date)) {
          return 'End date must be after start date';
        }
        return true;
      }
    },
    rebate_days: {
      required: true,
      type: 'number',
      min: 1
    }
  },
  checkOverlap: {
    roll_no: {
      required: true,
      type: 'string',
      minLength: 1
    },
    start_date: {
      required: true,
      type: 'string',
      isDate: true
    },
    end_date: {
      required: true,
      type: 'string',
      isDate: true,
      custom: (value, data) => {
        if (new Date(value) <= new Date(data.start_date)) {
          return 'End date must be after start date';
        }
        return true;
      }
    }
  }
};

/**
 * Authentication validation schemas
 */
const authSchemas = {
  login: {
    username: {
      required: true,
      type: 'string',
      minLength: 3,
      maxLength: 50
    },
    password: {
      required: true,
      type: 'string',
      minLength: 6
    }
  }
};

/**
 * Statistics validation schemas
 */
const statisticsSchemas = {
  query: {
    year: {
      required: false,
      type: 'string',
      numeric: true
    },
    branch: {
      required: false,
      type: 'string'
    },
    batch: {
      required: false,
      type: 'string'
    },
    page: {
      required: false,
      type: 'string',
      numeric: true,
      min: 1
    },
    limit: {
      required: false,
      type: 'string',
      numeric: true,
      min: 1,
      max: 100
    }
  }
};

export {
  rebateSchemas,
  authSchemas,
  statisticsSchemas
}; 