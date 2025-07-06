use candid::{CandidType, Principal};
use serde::{Deserialize, Serialize};
use std::cell::RefCell;

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
struct Property {
    id: u64,
    name: String,
    owner: Principal,
    price: u64,
    is_leased: bool,
}

thread_local! {
    static PROPERTIES: RefCell<Vec<Property>> = RefCell::new(Vec::new());
}

#[ic_cdk::query]
fn get_properties() -> Vec<Property> {
    PROPERTIES.with(|props| props.borrow().clone())
}

#[ic_cdk::update]
fn add_property(name: String, price: u64) {
    let caller = ic_cdk::caller();
    let property = Property {
        id: ic_cdk::api::time(),
        name,
        owner: caller,
        price,
        is_leased: false,
    };
    PROPERTIES.with(|props| props.borrow_mut().push(property));
}

#[ic_cdk::update]
fn buy_property(id: u64) -> Result<String, String> {
    let caller = ic_cdk::caller();
    PROPERTIES.with(|props| {
        let mut props = props.borrow_mut();
        if let Some(prop) = props.iter_mut().find(|p| p.id == id) {
            if prop.owner != caller {
                prop.owner = caller;
                Ok("Purchase successful!".to_string())
            } else {
                Err("You already own this property".to_string())
            }
        } else {
            Err("Property not found".to_string())
        }
    })
}
