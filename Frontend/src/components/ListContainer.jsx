// columns: [{ key: "name", label: "Product Name", render: (row) => ... }]
const ListContainer = ({ columns, data, emptyText = "No records found.", renderActions }) => {
    const totalColumns = columns.length + (renderActions ? 1 : 0);

    return (
        <>
        <section id="listContainer">
            <table>
                <thead>
                    <tr>
                        {columns.map((column) => (
                            <th key={column.key}>{column.label}</th>
                        ))}
                        {renderActions && <th></th>}
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 && (
                        <tr><td colSpan={totalColumns} className="empty">{emptyText}</td></tr>
                    )}
                    {data.map((row) => (
                        <tr key={row.id} className="list-item">
                            {columns.map((column) => (
                                <td key={column.key}>
                                    {column.render ? column.render(row) : row[column.key]}
                                </td>
                            ))}
                            {renderActions && <td>{renderActions(row)}</td>}
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
        </>
    )
}

export default ListContainer;