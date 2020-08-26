import {EmailChange} from '../modules/user/email-change/email-change.entity';

export class UserUtil {
    /**
     * Fetch the current active mail change from the mailChange list. <br />
     * Active state is determined by checking the time interval (max 24h old),
     * plus the used state.
     *
     * @param emailChange List of all email changes to filter in
     * @return EmailChange[] List of all active email  (should just be one item)
     */
    public static filterActiveEmailChanges(emailChange: EmailChange[]) {
        if (emailChange === undefined) {
            return [];
        }

        return emailChange.filter(fEmailChange =>
            (fEmailChange.iat.getTime()) + (24 * 60 * 60 * 1000) > Date.now()
            && fEmailChange.oldMail != 'invalid'
            && !fEmailChange.used);
    }
}
