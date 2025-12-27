const Dialog = (props) => {
    
    document.getElementsByClassName("page")[0].style.filter = "blur(3px)";
    document.getElementsByClassName("page")[0].inert = true;
    
    const handleYes = () => {
        document.getElementsByClassName("page")[0].style.filter = "blur(0px)";
        document.getElementsByClassName("page")[0].inert = false;
        
        return props.onConfirm && props.onConfirm();
    }
    
    const handleNo = () => {
        document.getElementsByClassName("page")[0].style.filter = "blur(0px)";
        document.getElementsByClassName("page")[0].inert = false;
        
        return props.onCancel && props.onCancel();
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