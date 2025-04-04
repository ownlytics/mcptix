import Database from 'better-sqlite3';
import { TicketQueries } from '../../db/queries';
export declare function initTestDatabase(): {
    db: Database.Database;
    ticketQueries: TicketQueries;
};
export declare function cleanupTestDatabase(db: Database.Database): void;
export declare function resetTestDatabase(db: Database.Database): void;
//# sourceMappingURL=test-utils.d.ts.map