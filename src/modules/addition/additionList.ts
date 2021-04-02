import {Addition} from './addition.entity';
import {DuplicateValueException} from '../../exceptions/DuplicateValueException';
import {IAppointmentCreationAdditionDTO} from '../appointment/IAppointmentCreationAdditionDTO';

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
     * Get a string array containing all names of the passed {@link IAppointmentCreationAdditionDTO} array
     *
     * @param additions         Array of {@link IAppointmentCreationAdditionDTO}
     * @private
     */
    private static getListOfAdditionNames(additions: IAppointmentCreationAdditionDTO[]) {
        return additions.map(
            (mUnfilteredAddition: Addition) => {
                return mUnfilteredAddition.name;
            });
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
     * Check array of {@link IAppointmentCreationAdditionDTO} for duplicates.<br/>
     * Method searches all names, and identifies duplicates.
     *
     * @throws {@link DuplicateValueException}      If name of {@link Addition} occurs more than once in List
     *
     * @param additions                             {@link IAppointmentCreationAdditionDTO}
     *
     * @private Method is used internally for mapping only
     */
    private checkForDuplicateNames(additions: IAppointmentCreationAdditionDTO[]): void {
        let occurringNames = AdditionList.getListOfAdditionNames(additions);

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
}
