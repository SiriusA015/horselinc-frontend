export class HLMessageModel {
    message: string;

    constructor(message: string) {
        this.message = message;
    }

    toJSON() {
        const dicObject = Object.assign({}, this);
        return JSON.parse(JSON.stringify(dicObject));
    }
}