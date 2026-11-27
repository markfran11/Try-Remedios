import { getStockStatus } from "../constants/stockStatus";

const StatusBadge = ({ stock, reorderLevel }) => {
    const status = getStockStatus(stock, reorderLevel);

    return <span className={status.className}>{status.label}</span>;
}

export default StatusBadge;