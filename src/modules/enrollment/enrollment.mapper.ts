import { UserUtil } from '../../util/user.util';
import { Enrollment } from './enrollment.entity';
import { UserService } from '../user/user.service';
import { KeycloakUser } from '../user/KeycloakUser';
import { IEnrollmentDTO } from './IEnrollmentDTO';

const passengerMapper = require('./passenger/passenger.mapper');
const driverMapper = require('./driver/driver.mapper');

export class EnrollmentMapper {

    constructor(private readonly userService: UserService) {
    }

    /**
     * Create a object only contained the important creation values of the passed {@link Enrollment}. <br/>
     * Those values are only the id and the permission token (if existing).
     *
     * @param enrollment       {@link Enrollment} to minify
     */
    create(enrollment: Enrollment): { id: string, token?: string } { // INTERFACE
        const _enrollment = (({
            id,
        }) => ({
            id,
        } as any))
            (enrollment);

        if (enrollment.token) {
            _enrollment.token = enrollment.token;
        }

        return _enrollment;
    }

    public async basic(_enrollment: Enrollment): Promise<IEnrollmentDTO> {
        let enrollment;

        enrollment = (({
            id,
            name,
            comment,
            additions,
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

        enrollment.additions.sort((a, b) => {
            if (a.order < b.order) {
                return -1;
            }
            if (a.order > b.order) {
                return 1;
            }
            return 0;
        });

        enrollment.additions?.map((fAddition) => {
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

        if (_enrollment.appointment) {
            enrollment.appointment = {
                link: _enrollment.appointment._link,
                location: `${process.env.API_URL}appointments/${_enrollment.appointment._link}`
            };
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
