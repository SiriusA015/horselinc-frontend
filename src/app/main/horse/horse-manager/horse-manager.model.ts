export class HorseManager
{
    id: string;
    from: {
        name: string,
        avatar: string,
        email: string
    };
    to: {
        name: string,
        email: string
    }[];
    subject: string;
    message: string;
    time: string;
    read: boolean;
    starred: boolean;
    important: boolean;
    hasAttachments: boolean;
    attachments: {
        type: string,
        fileName: string,
        preview: string,
        url: string,
        size: string
    }[];
    labels: string[];
    folder: string;

    /**
     * Constructor
     *
     * @param horsemanager
     */
    constructor(horseManager)
    {
        this.id = horseManager.id;
        this.from = horseManager.from;
        this.to = horseManager.to;
        this.subject = horseManager.subject;
        this.message = horseManager.message;
        this.time = horseManager.time;
        this.read = horseManager.read;
        this.starred = horseManager.starred;
        this.important = horseManager.important;
        this.hasAttachments = horseManager.hasAttachments;
        this.attachments = horseManager.attachments;
        this.labels = horseManager.labels;
        this.folder = horseManager.folder;
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
}
