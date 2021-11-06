import { AlreadyUsedException } from './../../exceptions/AlreadyUsedException';
import { Addition } from './addition.entity';
import { DuplicateValueException } from '../../exceptions/DuplicateValueException';
import { IAppointmentCreationAdditionDTO } from '../appointment/DTOs/IAppointmentCreationAdditionDTO';
import { EntityNotFoundException } from '../../exceptions/EntityNotFoundException';
import { Appointment } from '../appointment/appointment.entity';
import { MissingValuesException } from '../../exceptions/MissingValuesException';
import { IAppointmentUpdateAdditionDTO } from '../appointment/DTOs/IAppointmentUpdateAdditionDTO';

export class AdditionList {
    private list: Addition[];

    constructor(list: Addition[] = []) {
        if (list) {
            this.list = list;
        } else {
            this.list = [];
        }
    }

    /**
     * Get raw {@link Addition} list of {@link AdditionList}
     *
     * @return Array of {@link Addition}
     */
    public getArray(): Addition[] {
        this.sortByOrder();

        return this.list;
    }

    /**
     * Converts raw data from {@link Appointment} creation into a proper {@link Addition} format.
     * List of {@link Addition} does not foresee duplicates. Method executes check for duplicates.<br/>
     * Populates {@link Addition} with a order value based on passed array.
     *
     * @throws {@link DuplicateValueException}      See {@link checkForDuplicateNames}
     *
     * @param additions                             {@link IAppointmentCreationAdditionDTO}
     */
    public convertRawDataToAdditionList(additions: IAppointmentCreationAdditionDTO[]): void {
        let output = [];

        if (!additions) {
            this.list = output;

            return;
        }

        this.checkForDuplicateNames(additions);

        let i = 0;
        if (Array.isArray(additions)) {
            additions.forEach(
                (fAddition) => {
                    let addition: Addition = new Addition();
                    addition.name = fAddition.name;
                    addition.order = i;

                    output.push(addition);

                    i++;
                }
            );
        }

        this.list = output;

        this.sortByOrder();
    }

    /**
     * Update list of {@link Addition}.<br/>
     * Check for duplicate names and if {@link Addition} is even part of the referenced {@link Appointment}.<br/>
     *
     * @param mixedAdditions                        List of existing {@link IAppointmentUpdateAdditionDTO} to use existing
     *                                              or create new {@link Addition}
     *
     * @throws {@link EntityNotFoundException}      See {@link findById}
     */
    public updateList(mixedAdditions: IAppointmentUpdateAdditionDTO[]) {
        let refreshedList = [];

        this.checkForDuplicateNames(mixedAdditions);

        let index = 0;
        for (let fAddition of mixedAdditions) {
            let addition = new Addition();

            if (fAddition['id']) {
                addition = this.findById(fAddition['id']!);
            }

            if (fAddition.name && !addition.name) {
                addition.name = fAddition.name;
            }

            if (!addition.name) {
                throw new MissingValuesException(null,
                    'Please specify the following values',
                    [{
                        'object': 'addition',
                        'in': 'body',
                        'attribute': 'name',
                        'message': 'Object has no attribute \'name\'. Either provide a valid id to refer to a Addition, or provide a name for Addition creation.'
                    }]);
            }

            addition.order = index;

            refreshedList.push(addition);

            index++;
        }

        this.list = refreshedList;
    }

    /**
     * Sort list by "order" attribute
     */
    public sortByOrder() {
        this.list
            .sort(
                (a, b) => {
                    return a.order < b.order ? -1 : 1;
                }
            );
    }

    /**
     * Get a string array all names of the passed {@link IAppointmentCreationAdditionDTO} or {@link IAppointmentUpdateAdditionDTO}.<br/>
     * When {@link IAppointmentUpdateAdditionDTO} is not providing a name, search for existing {@link Addition} in {@link Appointment} and use
     * found name
     *
     * @param additions         List of {@link IAppointmentCreationAdditionDTO} or {@link IAppointmentUpdateAdditionDTO}
     *
     * @return  string[] containing all directly and indirectly occurring names
     */
    private getListOfAdditionNames(additions: (IAppointmentCreationAdditionDTO | IAppointmentUpdateAdditionDTO)[]): string[] {
        return additions.map(
            (mUnfilteredAddition: Addition) => {
                if (mUnfilteredAddition.name) {
                    return mUnfilteredAddition.name;
                }

                try {
                    let addition = this.findById(mUnfilteredAddition.id);
                    return addition.name;
                } catch (e) {
                    //
                }
            }
        );
    }

    /**
     * Check array of {@link IAppointmentCreationAdditionDTO} and {@link IAppointmentUpdateAdditionDTO} for duplicate names.
     *
     * @param additions                             List of {@link IAppointmentCreationAdditionDTO} or {@link IAppointmentUpdateAdditionDTO}
     *
     * @throws {@link DuplicateValueException}      If name of {@link Addition} occurs more than once in provided list
     */
    private checkForDuplicateNames(additions: (IAppointmentCreationAdditionDTO | IAppointmentUpdateAdditionDTO)[]): void {
        const duplicates = this.getDuplicateNames(additions);

        const errors = [];
        duplicates.forEach(
            (fDuplicate) => {
                errors.push({
                    'object': 'addition',
                    'attribute': 'name',
                    'value': fDuplicate,
                    'in': 'body'
                });
            }
        );

        if (duplicates.length > 0) {
            throw new DuplicateValueException('DUPLICATE_VALUES',
                'Following values are duplicates and can not be used',
                errors);
        }
    }

    /**
     * Get all duplicate values of array of {@link IAppointmentCreationAdditionDTO} and {@link IAppointmentUpdateAdditionDTO}
     *
     * @param additions         List of {@link IAppointmentCreationAdditionDTO} and {@link IAppointmentUpdateAdditionDTO}
     *
     * @return string[] list of duplicate values
     */
    private getDuplicateNames(additions: (IAppointmentCreationAdditionDTO | IAppointmentUpdateAdditionDTO)[]): string[] {
        let occurringNames = this.getListOfAdditionNames(additions);

        const occurringNames_sorted = occurringNames.slice().sort();

        const duplicates = [];
        for (let i = 0; i < occurringNames_sorted.length - 1; i++) {
            const currentName = occurringNames_sorted[i];
            if (currentName === occurringNames_sorted[i + 1]) {
                if (!duplicates.includes(currentName)) {
                    duplicates.push(currentName);
                }
            }
        }
        return duplicates;
    }

    /**
     * Find {@link Addition} by its unique ID.
     *
     * @param id        String ID of {@link Addition}
     *
     * @throws          {@link EntityNotFoundException} if {@link Addition} is not found in list
     */
    private findById(id: string) {
        const addition = this.list.find(
            (sAddition: Addition) => {
                return sAddition.id === id;
            }
        );

        if (!addition) {
            throw new EntityNotFoundException(null, null, {
                'object': 'addition',
                'attribute': 'id',
                'in': 'body',
                'value': id
            });
        }

        return addition;
    }
}
