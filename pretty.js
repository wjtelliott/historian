const Colors = {
    //Reset: "\x1b[0,",
    Log: "\x1b[35m",
    BOT: "\x1b[34m",
    Warn: "\x1b[33m",
    Error: "\x1b[31m",
    White: "\x1b[37m",
};

class Display {
    constructor() {
        this.colors = Colors;
    }
    log(message) {
        console.log(
            `${this.colors.Warn}[${this.colors.BOT}LOG${this.colors.Warn}]: ${this.colors.White}${message}`
        );
    }
    warn(message) {
        console.log(
            `${this.colors.Warn}[${this.colors.Error}WARNING${this.colors.Warn}]: ${this.colors.Warn}${message}`
        );
    }
    error(message) {
        console.log(
            `${this.colors.Warn}[${this.colors.Error}ERROR${this.colors.Warn}]: ${this.colors.Error}${message}`
        );
    }
    print(message, logType) {
        const formattedType =
            logType == null || !(logType in Colors) ? "White" : logType;
        console.log(`${this.colors[formattedType]}${message}`);
    }
}

module.exports = { Colors, Display };
