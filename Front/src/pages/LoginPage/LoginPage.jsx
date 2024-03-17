import styles from './LoginPage.module.css'
import "../../../src/index.css"

function LoginPage() {
    return (
        <>
            <div className={styles.container}>
                <div className={styles.left}>
                    <h1 className={styles.branding}>Sehat</h1>
                </div>
                <div className={styles.right}>
                    <h3 className={styles.loginButton}>Login</h3>
                    <div className={styles.loginContainer}>
                        <h2>Create an account</h2>
                        <h6>Enter your email below to create your account</h6>
                        <input type="email" placeholder="johndoe@example.com" className='std-input'/>
                        <button className='std-button'>Create Account</button>
                    </div>
                </div> 
            </div>
        </>
    )
}

export default LoginPage;