const Dialog = (props) => {
    
    const handleYes = () => {
        return props.onConfirm && props.onConfirm();
    }
    
    const handleNo = () => {
        return props.onCancel && props.onCancel()
    }
    
    return (
        <>
            <div className="dialog" style={{backgroundColor: props.color}}>
                <h2>{props.title}</h2>
                <br />
                <br />
                <button className="buttons" style={{backgroundColor: "red"}} onClick={handleYes} >{props.ok}</button>
                {props.no !== undefined ? <><button className="buttons" onClick={handleNo} >{props.no}</button></> : null}
            </div>
        </>
    )
    
}

export default Dialog;