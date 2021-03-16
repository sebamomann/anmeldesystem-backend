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
                           creatorId,
                           iat
                       }) => ({
            id,
            name,
            comment,
            additions,
            comments,
            creatorId,
            iat
        }))
        (_enrollment);

        enrollment.additions.map((fAddition) => {
            delete fAddition.id;
            delete fAddition.order;
        });

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

        const keys = Object.keys(enrollment);
        keys.forEach((key) => {
            if (!enrollment[key] || enrollment[key].length === 0) {
                delete enrollment[key];
            }
        });

        return enrollment;
    }

    public async stripCreator(enrollment: Enrollment): Promise<void> {
        if (enrollment.creatorId != null) {
            const creator: KeycloakUser = await this.userService.findById(enrollment.creatorId);
            enrollment.creator = UserUtil.stripUserMin(creator);
            delete enrollment.name;
        }

        delete enrollment.creatorId;
    }
}
