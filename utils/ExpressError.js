class ExpressError extends Error {
    constructor(statusCode, message){
        super();
        this.statusCode = statusCode;
        this.message = message;  // fixed
    }
}

module.exports = ExpressError;
