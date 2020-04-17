import {Test, TestingModule} from '@nestjs/testing';
import {CommentController} from './comment.controller';
import {Comment} from './comment.entity';
import {CommentService} from './comment.service';
import {HttpStatus} from '@nestjs/common';
import {EntityNotFoundException} from '../../../exceptions/EntityNotFoundException';

jest.mock('./comment.service');

describe('Comment Controller', () => {
    let commentController: CommentController;
    let commentService: CommentService;
    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
            controllers: [CommentController],
            providers: [
                CommentService
            ]
        }).compile();

        commentService = module.get<CommentService>(CommentService);
        commentController = module.get<CommentController>(CommentController);

    });

    it('should be defined', () => {
        expect(commentController).toBeDefined();
    });

    describe('* create comment', () => {
        describe('* successful should return entity of comment with 201 status code', () => {
            it('successful request', async () => {
                const result = new Comment();

                jest.spyOn(commentService, 'create')
                    .mockReturnValueOnce(Promise.resolve(result));

                const mockCommentToSatisfyParameter = new Comment();
                const res = mockResponse();

                await commentController
                    .create(mockCommentToSatisfyParameter, res);

                expect(res.status).toHaveBeenCalledWith(HttpStatus.CREATED);
                expect(res.status).toBeCalledTimes(1);
                expect(res.json).toHaveBeenCalledWith(result);
            });
        });

        describe('* failure should forward error', () => {
            it('enrollment not found', async () => {
                const result = new EntityNotFoundException(null, null, 'enrollment');

                jest.spyOn(commentService, 'create')
                    .mockImplementation(async (): Promise<Comment> => Promise.reject(result));

                const mockCommentToSatisfyParameter = new Comment();
                const res = mockResponse();

                commentController
                    .create(mockCommentToSatisfyParameter, res)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have thrown EntityNotFoundException');
                    })
                    .catch((err) => {
                        expect(err).toBe(result);
                    });
            });

            it('undefined error', async () => {
                const result = new Error();

                jest.spyOn(commentService, 'create')
                    .mockReturnValueOnce(Promise.reject(result));

                const mockCommentToSatisfyParameter = new Comment();
                const res = mockResponse();

                commentController
                    .create(mockCommentToSatisfyParameter, res)
                    .then(() => {
                        throw new Error('I have failed you, Anakin. Should have thrown Error');
                    })
                    .catch(err => {
                        expect(err).toBe(result);
                    });
            });
        });
    });

    afterEach(() => {
        jest.resetAllMocks();
    });
});

const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};
