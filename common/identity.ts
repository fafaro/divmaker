export class Identity {
    private _id: number = generateUniqueId();
    public get id(): number {
        return this._id;
    }
}

let uniqueId = 0;
function generateUniqueId(): number {
    return uniqueId++;
}