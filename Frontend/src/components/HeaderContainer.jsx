const HeaderContainer = ({ title, subtitle, children }) => {

    return (
        <>
        <section id="headerContainer">
            <h1>{title}</h1>
            {subtitle && <small>{subtitle}</small>}
            {children}
        </section>
        </>
    )
}

export default HeaderContainer;