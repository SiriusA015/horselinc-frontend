export class PaymentManager
{
    id: string;
    title: string;
    notes: string;
    startDate: string;
    dueDate: boolean;
    completed: boolean;
    starred: boolean;
    important: boolean;
    deleted: boolean;
    tags: [
        {
            'id': number,
            'name': string,
            'label': string,
            'color': string
        }
        ];

    /**
     * Constructor
     *
     * @param 
     */
    constructor(payment)
    {
        {
            this.id = payment.id;
            this.title = payment.title;
            this.notes = payment.notes;
            this.startDate = payment.startDate;
            this.dueDate = payment.dueDate;
            this.completed = payment.completed;
            this.starred = payment.starred;
            this.important = payment.important;
            this.deleted = payment.deleted;
            this.tags = payment.tags || [];
        }
    }

    /**
     * Toggle star
     */
    toggleStar(): void
    {
        this.starred = !this.starred;
    }

    /**
     * Toggle important
     */
    toggleImportant(): void
    {
        this.important = !this.important;
    }

    /**
     * Toggle completed
     */
    toggleCompleted(): void
    {
        this.completed = !this.completed;
    }

    /**
     * Toggle deleted
     */
    toggleDeleted(): void
    {
        this.deleted = !this.deleted;
    }
}
