import { DeleteResult, Repository, UpdateResult } from "typeorm";
import ITypeorm from "../../interfaces/IRepository";

export default abstract class RepositoryModel<T> implements ITypeorm<T> {
    protected abstract readonly typeORM: Repository<any>;
    
    getAll(): Promise<T[]> {
        return this.typeORM.find();
    }
    
    getById(id: string): Promise<T | null> {
        return this.typeORM.findOne({
            where: {id}
        });
    }
    
    getByUserId(userId: string): Promise<T[] | null> {
        return this.typeORM.find({
            where: {userId}
        });
    }
    
    create(entity: T): Promise<T | null> {
        return this.typeORM.save(entity);
    }
    
    edit(id: string, entity: Partial<T>): Promise<UpdateResult> {
        return this.typeORM.update(id, entity);
    }
    
    delete(id: string): Promise<DeleteResult> {
        return this.typeORM.delete(id);
    }
}