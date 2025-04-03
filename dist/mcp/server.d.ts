declare class EpicTrackerMcpServer {
    private server;
    private db;
    private ticketQueries;
    constructor();
    run(): Promise<void>;
}
export { EpicTrackerMcpServer };
