'use client'
import React from 'react';

import { getServerSession } from 'next-auth';
  import { 
    IcClassificationBanner,
    IcFooter,
    IcNavigationItem,
    IcSectionContainer,
    IcTopNavigation,
    SlottedSVG, IcPageHeader, IcNavigationButton
  } from '@ukic/react';import type { IcAlignment } from '@ukic/web-components';
  import { mdiAccount, mdiCog, mdiPencil, mdiHumanGreetingProximity } from '@mdi/js';
    
  import { createUseStyles } from 'react-jss';
  
  import "@ukic/fonts/dist/fonts.css";
  import "@ukic/react/dist/core/core.css";
  import "@ukic/react/dist/core/normalize.css";
  import 'bootstrap/dist/css/bootstrap.css';
 
  import "./globals.css";
import Providers from "./providers";
import BootstrapClient from "./bootstrap";
import Navbar from "@/components/Navbar"




export default  function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
const alignment: IcAlignment = "center";
  let pageHeaderAlignment;
    // pageHeaderAlignment: IcAlignment = "center";
    const useStyles = createUseStyles({
      main: { minHeight: "100vh", display: "flex" },
      mainContentDiv: {
        border: "var(--ic-border-width) dashed var(--ic-architectural-400)",
        padding: 1,
        flex: 1,
      },
      
      mainSectionContainer: {flex: 1 , padding: 3},
    });
    const classes = useStyles(); 



  return (
   <>
      <html lang="en">
        <head>
          <title>OPUS STORM</title>

        </head>
        <body>
        <IcClassificationBanner />
       
        <IcTopNavigation
          appTitle="OPUS STORM"
          status="Phase 1.0"
          version=""
          contentAligned={alignment}
        >
          <SlottedSVG
            slot="app-icon"
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="#000000"
            width="24"
            height="24" 
            path={mdiHumanGreetingProximity}
          >
          </SlottedSVG>
          
          
                   <IcNavigationButton label="My Profile" slot="buttons" 
                   data-bs-toggle="offcanvas"
              role="button"
              aria-controls="offcanvasExample"
              data-bs-target="#offcanvasExample"
                   >
            <SlottedSVG
              slot="icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24" 
              path={mdiAccount}
             
              

            />
          </IcNavigationButton>
          <IcNavigationItem slot="navigation" label="Contacts search" href="/" title="Contacts search" />
          <IcNavigationItem slot="navigation" label="Ministers search" href="/ministers" title="Ministers search" />
          <IcNavigationItem slot="navigation" label="Tag search" href="#collapseTag" data-bs-toggle="collapse" aria-expanded="false" aria-controls="collapseTag"/>
          <IcNavigationItem slot="navigation" label="My contacts" href="/mycontacts" title="My contacts" />
          <IcNavigationItem slot="navigation" label="Teams" href="#collapseExample" data-bs-toggle="collapse" aria-expanded="false" aria-controls="collapseExample"/>
          <IcNavigationItem slot="navigation" label="Help" href="/help" title="Help" />
        </IcTopNavigation>
            
        
        <main id="main" className={classes.main}>
          <IcSectionContainer className={classes.mainSectionContainer} aligned={alignment}>
            <div style={{minHeight: "75vh;"}}>

                <Providers>
                  <BootstrapClient />
                  <Navbar />
                  {children}
                  
                  </Providers>

             
            </div>
          </IcSectionContainer>
        </main>
        <IcFooter
          aligned={alignment}
          caption="This information is exempt under the Freedom of Information Act 2000 (FOIA) and may be exempt under other UK information legislation."
          description="This pattern was built using the Intelligence Community Design System (ICDS)."
        >
          
        </IcFooter>
        </body>

        </html>
      </>
  );
}

