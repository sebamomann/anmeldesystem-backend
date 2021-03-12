import {UserUtil} from '../../util/user.util';
import {Enrollment} from './enrollment.entity';

const passengerMapper = require('./passenger/passenger.mapper');
const driverMapper = require('./driver/driver.mapper');

export class EnrollmentMapper {

    public static basic(_enrollment) {
        let enrollment;

        enrollment = (({
                           id,
                           name,
                           comment,
                           additions, // TODO REMOVE NAMES OF ADDITIONS
                           comments,
                           creator,
                           iat
                       }) => ({
            id,
            name,
            comment,
            additions,
            comments,
            creator,
            iat
        }))
        (_enrollment);

        enrollment.createdByUser = _enrollment.creator !== null
            && _enrollment.creator !== undefined;

        if (_enrollment.token !== undefined) {
            enrollment.token = _enrollment.token;
        }

        if (_enrollment.driver !== undefined
            && _enrollment.driver !== null) {
            enrollment.driver = driverMapper.basic(_enrollment.driver);
        }

        if (_enrollment.passenger !== undefined
            && _enrollment.passenger !== null) {
            enrollment.passenger = passengerMapper.basic(_enrollment.passenger);
        }

        enrollment = this.stripCreator(enrollment);

        return enrollment;
    }

    // TODO
    // get creator information from keycloak
    public static stripCreator(enrollment: Enrollment): Enrollment {
        enrollment.createdByUser = enrollment.creatorId != null;

        if (enrollment.createdByUser) {

            // TODO
            // const creator = getFromKeycloak(enrollment.creatorId);
            const creator = {} as any;

            // noinspection UnnecessaryLocalVariableJS
            const mUser: any = UserUtil.stripUserMin(creator); // no inline due to type conversion
            enrollment.creator = mUser;
            delete enrollment.name;
        }

        return enrollment;
    }
}
