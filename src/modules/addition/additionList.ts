import {Addition} from './addition.entity';
import {DuplicateValueException} from '../../exceptions/DuplicateValueException';
import {IAppointmentCreationAdditionDTO} from '../appointment/IAppointmentCreationAdditionDTO';
import {EntityNotFoundException} from '../../exceptions/EntityNotFoundException';
import {Appointment} from '../appointment/appointment.entity';
import {MissingValuesException} from '../../exceptions/MissingValuesException';

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
     * Get raw data of {@link AdditionList}
     *
     * @return list         Array of {@link Addition}
     */
    public getArray(): Addition[] {
        return this.list;
    }

    /**
     * Converts raw data from {@link Appointment} creation into a proper {@link Addition} format.
     * List of {@link Addition} does not foresee duplicates. Method checks for duplicates.<br/>
     * Populates {@link Addition} with a order based on passed array
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
     * Check for duplicate names and if {@link Addition} is even part of the referenced {@link Appointment}
     *
     * @param mixedAdditions                        List of existing {@link Addition} and
     *                                              {@link Addition} to create by {@link IAppointmentCreationAdditionDTO}
     *
     * @throws {@link EntityNotFoundException}      See {@link findById}
     */
    public updateList(mixedAdditions: (IAppointmentCreationAdditionDTO | Addition)[]) {
        let refreshedList = [];

        this.checkForDuplicateNames(mixedAdditions);

        let index = 0;
        for (let fAddition of mixedAdditions) {
            let addition = new Addition();

            if (fAddition['id']) {
                addition = this.findById(fAddition['id']);
            }

            if (fAddition.name) {
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
     * Get a string array containing all names of the passed {@link IAppointmentCreationAdditionDTO} or {@link Addition}
     *
     * @param additions         Array of {@link IAppointmentCreationAdditionDTO} or {@link Addition}
     * @private
     */
    private getListOfAdditionNames(additions: (IAppointmentCreationAdditionDTO | Addition)[]) {
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
            });
    }

    /**
     * Check array of {@link IAppointmentCreationAdditionDTO} for duplicates.<br/>
     * Method searches all names, and identifies duplicates.
     *
     * @throws {@link DuplicateValueException}      If name of {@link Addition} occurs more than once in List
     *
     * @param additions                             {@link IAppointmentCreationAdditionDTO}
     *
     * @private Method is used internally for mapping only
     */
    private checkForDuplicateNames(additions: (IAppointmentCreationAdditionDTO | Addition)[]): void {
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
            throw new DuplicateValueException('DUPLICATE_ENTRY',
                'Following values are duplicates and can not be used',
                errors);
        }
    }

    /**
     * Sort list by "order" attribute
     *
     * @private
     */
    private sortByOrder() {
        this.list
            .sort(
                (a, b) => {
                    return a.order < b.order ? -1 : 1;
                }
            );
    }

    /**
     * Find {@link Addition} by its unique ID.
     *
     * @param id        String ID of addition
     *
     * @throws          {@EntityNotFoundException} if {@link Addition} is not found in list
     *
     * @private
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
