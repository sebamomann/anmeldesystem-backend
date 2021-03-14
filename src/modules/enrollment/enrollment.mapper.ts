import {UserUtil} from '../../util/user.util';
import {Enrollment} from './enrollment.entity';
import {UserService} from '../user/user.service';
import {KeycloakUser} from '../user/KeycloakUser';

const passengerMapper = require('./passenger/passenger.mapper');
const driverMapper = require('./driver/driver.mapper');

export class EnrollmentMapper {

    constructor(private readonly userService: UserService) {
    }

    public async basic(_enrollment: Enrollment) {
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

        await this.stripCreator(enrollment);

        return enrollment;
    }

    public async stripCreator(enrollment: Enrollment): Promise<void> {
        enrollment.createdByUser = enrollment.creatorId != null;

        if (enrollment.createdByUser) {
            const creator: KeycloakUser = await this.userService.findById(enrollment.creatorId);
            enrollment.creator = UserUtil.stripUserMin(creator);
            delete enrollment.name;
        }
    }
}
