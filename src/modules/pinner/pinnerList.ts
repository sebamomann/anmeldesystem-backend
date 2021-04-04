import {Pinner} from './pinner.entity';
import {JWT_User} from '../user/user.model';

export class PinnerList {
    private list: Pinner[];

    constructor(list: Pinner[]) {
        if (list) {
            this.list = list;
        } else {
            this.list = [];
        }
    }

    public getArray(): Pinner[] {
        return this.list;
    }

    public containsPinByUser(user: JWT_User): boolean {
        return this.list
            .some(
                (sPinner: Pinner) => {
                    return sPinner.userId === user.sub;
                }
            );
    }
}
