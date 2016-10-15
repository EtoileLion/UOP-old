var my_obj = {name: 'Mike',
               set_name: function(new_name) {
                           this.name = new_name;
                         },
               hello: function() {
                        console.log("Hiya, my name is " + new_name);
                      }
}; 
my_obj.set_name('Julie');
my_obj.hello();