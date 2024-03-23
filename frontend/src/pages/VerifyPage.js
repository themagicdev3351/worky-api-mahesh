import * as React from 'react';
import { useState } from 'react';
import { Grid, Box, Typography, Paper, CssBaseline, CircularProgress } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import bgpic from "../assets/designlogin.jpg"
import { LightPurpleButton } from '../components/buttonStyles';
import Popup from '../components/Popup';
import { useDispatch } from 'react-redux';
import { verifyEmailUser } from '../redux/userRelated/userHandle';

const defaultTheme = createTheme();

const VerifyPage = () => {
    const dispatch = useDispatch()
    const [loader, setLoader] = useState(false)
    const [showPopup, setShowPopup] = useState(false);
    const [message, setMessage] = useState("");



    const handleSubmit = (event) => {
        event.preventDefault();
        setMessage('rf')

        const currentUrl = window.location.href;

        const questionMarkIndex = currentUrl.indexOf('?');

        if (questionMarkIndex !== -1) {
            const token = currentUrl.substring(questionMarkIndex + 1);
            console.log(token)
            // const params = new URLSearchParams(queryString);
            // const token = params.get('token');

            console.log('Token:', token);
            setLoader(true)
            dispatch(verifyEmailUser(token))
            setLoader(false)
        }

    }; 

    return (
        <ThemeProvider theme={defaultTheme}>
            <Grid container component="main" sx={{ height: '100vh' }}>
                <CssBaseline />
                <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
                    <Box
                        sx={{
                            my: 8,
                            mx: 4,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        <Typography variant="h4" sx={{ mb: 2, color: "#2c2143" }}>
                            click to verify your email
                        </Typography>
                        {/* <Typography variant="h7">
                            Create your own school by registering as an admin.
                            <br />
                            You will be able to add students and faculty and
                            manage the system.
                        </Typography> */}
                        <LightPurpleButton
                            onClick={handleSubmit}
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                        >
                            {loader ? <CircularProgress size={24} color="inherit" /> : "verify"}
                        </LightPurpleButton>
                    </Box>
                </Grid>
                <Grid
                    item
                    xs={false}
                    sm={4}
                    md={7}
                    sx={{
                        backgroundImage: `url(${bgpic})`,
                        backgroundRepeat: 'no-repeat',
                        backgroundColor: (t) =>
                            t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900],
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />
            </Grid>
            <Popup message={message} setShowPopup={setShowPopup} showPopup={showPopup} />
        </ThemeProvider>
    );
}

export default VerifyPage;
