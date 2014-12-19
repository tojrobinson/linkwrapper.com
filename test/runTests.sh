if ! type tap > /dev/null
then
   read -p 'Requires tap. Install it from npm? [y/N]' INSTALL
   if [ "$INSTALL" = "y" ]
   then
      sudo npm install -g tap
      tap $(find functional unit -iname '*.js')
   else
      exit 1
   fi
else
   export NODE_ENV=testing
   tap $(find functional unit -iname '*.js')
fi
