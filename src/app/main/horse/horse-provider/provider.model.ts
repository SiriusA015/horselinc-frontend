export class Provider {
    id: string;
    name: string;

    constructor(provider)
    {
        {
            this.id = provider.id;
            this.name = provider.name;
        }
    }
}
