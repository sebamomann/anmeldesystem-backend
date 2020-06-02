import {Inject, Injectable, Request} from '@nestjs/common';
import {createConnection, Repository} from 'typeorm';
import {User} from '../user/user.entity';
import {Appointment} from '../appointment/appointment.entity';
import {Enrollment} from '../enrollment/enrollment.entity';
import {Driver} from '../enrollment/driver/driver.entity';
import {Passenger} from '../enrollment/passenger/passenger.entity';
import {Key} from '../enrollment/key/key.entity';
import {REQUEST} from '@nestjs/core';
import {InjectRepository} from '@nestjs/typeorm';
import {Addition} from '../addition/addition.entity';
import {File} from '../file/file.entity';
import {AppointmentService} from '../appointment/appointment.service';
import {Comment} from '../enrollment/comment/comment.entity';

@Injectable()
export class MigrationService {
    private conn;

    constructor(@Inject(REQUEST) private readonly request: Request,
                private readonly appointmentService: AppointmentService,
                @InjectRepository(Appointment)
                private readonly appointmentRepository: Repository<Appointment>,
                @InjectRepository(Passenger)
                private readonly passengerRepository: Repository<Passenger>,
                @InjectRepository(Addition)
                private readonly additionRepository: Repository<Addition>,
                @InjectRepository(File)
                private readonly fileRepository: Repository<File>,
                @InjectRepository(Key)
                private readonly keyRepository: Repository<Key>,
                @InjectRepository(User)
                private readonly userRepository: Repository<User>,
                @InjectRepository(Enrollment)
                private readonly enrollmentRepository: Repository<Enrollment>,
                @InjectRepository(Driver)
                private driverRepository: Repository<Driver>,
                @InjectRepository(Comment)
                private commentRepository: Repository<Comment>
    ) {


    }

    async migrate(userId, body) {
        let conn = await createConnection({
            name: "lala",
            type: "mysql",
            host: "",
            port: 3306,
            username: "",
            password: "",
            database: ""
        });

        let appointmentService = this.appointmentService;
        let appointmentRepository = this.appointmentRepository;
        let passengerRepository = this.passengerRepository;
        let additionRepository = this.additionRepository;
        let fileRepository = this.fileRepository;
        let keyRepository = this.keyRepository;
        let userRepository = this.userRepository;
        let enrollmentRepository = this.enrollmentRepository;
        let driverRepository = this.driverRepository;
        let commentRepository = this.commentRepository;

        this.conn = conn;

        var bcrypt = require('bcryptjs');

        try {
            const rawData = await conn.query(`SELECT * FROM users`);
            if (rawData.length > 0) {
                for (const data of rawData) {
                    let user: User = new User();
                    user.username = data.user_uid;
                    user.mail = data.user_mail;
                    user.activated = true;

                    await bcrypt.genSalt(10, async function (err, salt) {
                        await bcrypt.hash(makeid(20), salt, async function (err, hash) {
                            user.password = hash;

                            user = await userRepository.save(user);

                            const appointments = await conn.query(`SELECT * FROM termine WHERE termin_user_id = ?`, [data.user_id]);
                            if (appointments.length > 0) {
                                for (const fAppointment of appointments) {
                                    let appointment: Appointment = new Appointment();
                                    appointment.title = fAppointment.termin_title;
                                    appointment.description = fAppointment.termin_info;
                                    appointment.link = fAppointment.termin_link;
                                    appointment.location = fAppointment.termin_place;
                                    appointment.date = fAppointment.termin_date;
                                    appointment.deadline = fAppointment.termin_expire;
                                    appointment.maxEnrollments = fAppointment.termin_limit;
                                    appointment.driverAddition = fAppointment.termin_addition_driver;

                                    const additions = await conn.query(`SELECT * FROM termin_additions WHERE ta_termin_id = ?`, [fAppointment.termin_id]);
                                    let adds = [];
                                    if (additions.length > 0) {
                                        for (const fAddition of additions) {
                                            adds.push(fAddition.ta_title);
                                        }
                                    }
                                    adds;


                                    let appointmentToDb = new Appointment();
                                    appointmentToDb.title = appointment.title;
                                    appointmentToDb.description = appointment.description;
                                    appointmentToDb.link = appointment.link;
                                    appointmentToDb.location = appointment.location;
                                    appointmentToDb.date = appointment.date;
                                    appointmentToDb.deadline = appointment.deadline;

                                    if (appointment.maxEnrollments === 0) {
                                        appointmentToDb.maxEnrollments = null;
                                    } else {
                                        appointmentToDb.maxEnrollments = appointment.maxEnrollments;
                                    }

                                    appointmentToDb.driverAddition = appointment.driverAddition;
                                    appointmentToDb.creator = user;

                                    let additionsToDb = [];
                                    for (const fAddition of adds) {
                                        let _addition: Addition = new Addition();
                                        _addition.name = fAddition;
                                        await additionRepository.save(_addition);
                                        additionsToDb.push(_addition);
                                    }

                                    // Administrators
                                    appointmentToDb.administrators = [];
                                    appointmentToDb.additions = additionsToDb;
                                    // Files
                                    appointmentToDb.files = [];

                                    appointment = await appointmentRepository.save(appointmentToDb);


                                    const enrollments = await conn.query(`SELECT * FROM anmeldungen WHERE am_termin_id = ?`, [fAppointment.termin_id]);
                                    if (enrollments.length > 0) {
                                        console.log("enrollments");
                                        for (const fEnrollment of enrollments) {
                                            let enrollment: Enrollment = new Enrollment();
                                            enrollment.name = fEnrollment.am_name;
                                            enrollment.comment = fEnrollment.am_comment === "" ? null : fEnrollment.am_comment;
                                            enrollment.additions = [];

                                            const selectedAdditions = await conn.query(`SELECT * FROM termin_addition_selections WHERE tas_am_id = ?`, [fEnrollment.am_id]);
                                            if (selectedAdditions.length > 0) {
                                                console.log("selectedAdditions");
                                                for (const fSelected of selectedAdditions) {
                                                    const addition = await conn.query(`SELECT * FROM termin_additions WHERE ta_id = ?`, [fSelected.tas_ta_id]);
                                                    const additionName = addition.ta_title;
                                                    let additionObject = appointment.additions.filter(tmpAddition => {
                                                        if (tmpAddition.name === additionName)
                                                            return tmpAddition;
                                                    })[0];
                                                    if (additionObject !== undefined) {
                                                        enrollment.additions.push(additionObject);
                                                    }
                                                }
                                            }

                                            const drivers = await conn.query(`SELECT * FROM driver WHERE driver_am_id = ?`, [fEnrollment.am_id]);
                                            if (drivers.length > 0) {
                                                console.log("driver");
                                                let drv = drivers[0];
                                                let driver: Driver = new Driver();
                                                driver.seats = drv.driver_seats;
                                                driver.service = drv.driver_seats;

                                                driver = await driverRepository.save(driver);
                                                enrollment.driver = driver;
                                            } else {
                                                enrollment.driver = null
                                            }

                                            const passengers = await conn.query(`SELECT * FROM passengers WHERE passenger_am_id = ?`, [fEnrollment.am_id]);
                                            if (passengers.length > 0) {
                                                console.log("passenger");
                                                let pass = passengers[0];
                                                let passenger: Passenger = new Passenger();
                                                passenger.requirement = pass.passenger_requirement;

                                                passenger = await passengerRepository.save(passenger);
                                                enrollment.passenger = passenger;
                                            } else {
                                                enrollment.passenger = null
                                            }

                                            const key = new Key();
                                            key.key = makeid(10);
                                            enrollment.key = await keyRepository.save(key);
                                            enrollment.appointment = appointment;

                                            enrollment = await enrollmentRepository.save(enrollment);

                                            const comments = await conn.query(`SELECT * FROM comments WHERE comment_am_id = ?`, [fEnrollment.am_id]);
                                            if (comments.length > 0) {
                                                console.log("comments");
                                                for (const fComment of comments) {
                                                    const comment = new Comment();
                                                    comment.name = fComment.comment_name;
                                                    comment.comment = fComment.comment_content;
                                                    comment.enrollment = enrollment;

                                                    await commentRepository.save(comment);
                                                }
                                            }
                                        }
                                    }
                                }
                            }


                        });
                    });

                    function makeid(length) {
                        var result = '';
                        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                        var charactersLength = characters.length;
                        for (var i = 0; i < length; i++) {
                            result += characters.charAt(Math.floor(Math.random() * charactersLength));
                        }
                        return result;
                    }
                }
            }

            return true;
        } catch (e) {
            await conn.close();
            return false;
        }

    }
}
